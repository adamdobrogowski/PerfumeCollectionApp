// Onboarding: zapis w jednej transakcji.

// Oznacza onboarding jako ukonczony i zapisuje Lubiane oraz Nielubiane perfumy.
// value to wynik parseOnboarding(). Zwraca { alreadyCompleted: true }, gdy onboarding byl juz ukonczony
// (wtedy nic nie jest zapisywane), w przeciwnym razie { alreadyCompleted: false }.
async function saveOnboarding(client, userId, value) {
    // Warunek IS NULL robi z tego krok jednorazowy takze przy dwoch rownoleglych zadaniach:
    // drugie poczeka na pierwsze i zobaczy juz wypelniona date, wiec zmieni 0 wierszy.
    const marked = await client.query(
        `UPDATE user_profiles
            SET onboarding_completed_at = now(), updated_at = now()
          WHERE user_id = $1 AND onboarding_completed_at IS NULL`,
        [userId]
    );
    if (marked.rowCount === 0) {
        return { alreadyCompleted: true };
    }

    // Lubiane: ustawiamy opinie i sile, oznaczenie (kolekcja / lista zyczen) zostaje bez zmian.
    await client.query(
        `INSERT INTO shelf_entries (user_id, perfume_id, opinion, like_strength)
         SELECT $1::uuid, t.perfume_id, 'liked'::shelf_opinion_t, t.like_strength
           FROM unnest($2::integer[], $3::smallint[]) AS t(perfume_id, like_strength)
         ON CONFLICT (user_id, perfume_id) DO UPDATE
            SET opinion = 'liked',
                like_strength = EXCLUDED.like_strength,
                updated_at = now()`,
        [userId, value.liked.map((item) => item.perfumeId), value.liked.map((item) => item.likeStrength)]
    );

    // Nielubiane: bez sily; oznaczenie zostaje, ale lista zyczen jest czyszczona, bo baza nie dopuszcza
    // Nielubianych na liscie zyczen (shelf_entries_disliked_wishlist_chk).
    await client.query(
        `INSERT INTO shelf_entries (user_id, perfume_id, opinion)
         SELECT $1::uuid, t.perfume_id, 'disliked'::shelf_opinion_t
           FROM unnest($2::integer[]) AS t(perfume_id)
         ON CONFLICT (user_id, perfume_id) DO UPDATE
            SET opinion = 'disliked',
                like_strength = NULL,
                placement = CASE WHEN shelf_entries.placement = 'wishlist' THEN NULL ELSE shelf_entries.placement END,
                updated_at = now()`,
        [userId, value.disliked]
    );

    return { alreadyCompleted: false };
}

module.exports = { saveOnboarding };
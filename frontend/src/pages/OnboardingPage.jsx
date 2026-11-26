import { useState } from 'react'
import { Container, Stack, Stepper, Title } from '@mantine/core'
import DislikedStep from '../onboarding/DislikedStep.jsx'
import LikedStep from '../onboarding/LikedStep.jsx'
import { MAX_DISLIKED, MAX_LIKED } from '../onboarding/rules.js'
import SummaryStep from '../onboarding/SummaryStep.jsx'
import { useSaveOnboarding } from '../onboarding/useSaveOnboarding.js'
import { DEFAULT_LIKE_STRENGTH } from '../shelf/shelfState.js'

function OnboardingPage() {
  const [active, setActive] = useState(0)
  const [liked, setLiked] = useState([])
  const [disliked, setDisliked] = useState([])
  const saveMutation = useSaveOnboarding()

  function addLiked(perfume) {
    setLiked((previous) =>
      previous.length >= MAX_LIKED ? previous : [...previous, { perfume, strength: DEFAULT_LIKE_STRENGTH }],
    )
  }

  function changeStrength(perfumeId, strength) {
    setLiked((previous) =>
      previous.map((item) => (item.perfume.id === perfumeId ? { ...item, strength } : item)),
    )
  }

  function removeLiked(perfumeId) {
    setLiked((previous) => previous.filter((item) => item.perfume.id !== perfumeId))
  }

  function addDisliked(perfume) {
    setDisliked((previous) => (previous.length >= MAX_DISLIKED ? previous : [...previous, perfume]))
  }

  function removeDisliked(perfumeId) {
    setDisliked((previous) => previous.filter((perfume) => perfume.id !== perfumeId))
  }

  function finish() {
    saveMutation.mutate({
      liked: liked.map(({ perfume, strength }) => ({ perfumeId: perfume.id, likeStrength: strength })),
      disliked: disliked.map((perfume) => perfume.id),
    })
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={2}>Zacznijmy od Twojego gustu</Title>
        <Stepper active={active} size="sm">
          <Stepper.Step label="Lubiane" />
          <Stepper.Step label="Nielubiane" />
          <Stepper.Step label="Podsumowanie" />
        </Stepper>

        {active === 0 && (
          <LikedStep
            liked={liked}
            dislikedIds={disliked.map((perfume) => perfume.id)}
            onAdd={addLiked}
            onChangeStrength={changeStrength}
            onRemove={removeLiked}
            onNext={() => setActive(1)}
          />
        )}
        {active === 1 && (
          <DislikedStep
            disliked={disliked}
            likedIds={liked.map((item) => item.perfume.id)}
            onAdd={addDisliked}
            onRemove={removeDisliked}
            onBack={() => setActive(0)}
            onNext={() => setActive(2)}
          />
        )}
        {active === 2 && (
          <SummaryStep
            liked={liked}
            disliked={disliked}
            isSaving={saveMutation.isPending}
            error={saveMutation.error}
            onBack={() => setActive(1)}
            onFinish={finish}
          />
        )}
      </Stack>
    </Container>
  )
}

export default OnboardingPage
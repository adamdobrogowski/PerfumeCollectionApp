const app = require('./app');
const { warmUpDiscover } = require('./recommendation/discover/warm-up');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port 'http://localhost:${PORT}'`);

    warmUpDiscover().catch((err) => console.error('Rozgrzewka Odkrywania AI nie powiodła się:', err.message));
});
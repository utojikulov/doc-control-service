export default () => ({
    app: {
        port: process.env.PORT,
    },
    cache: {
        redis_password: process.env.REDIS_PASSWORD,
        redis_host: process.env.REDIS_HOST || 'localhost',
        redis_port: parseInt(process.env.REDIS_PORT || '6379', 10),
    }
})

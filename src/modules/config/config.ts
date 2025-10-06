export default () => ({
    app: {
        port: process.env.PORT,
    },
    cache: {
        redis_password: process.env.REDIS_PASSWORD,
        redis_host: process.env.REDIS_HOST || 'localhost',
        redis_port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expires_in: process.env.JWT_EXPIRESIN
    },
    s3: {
        bucket_name: process.env.S3_BUCKET_NAME,
        region: process.env.S3_REGION,
        access_key: process.env.S3_ACCESS_KEY,
        secret_access_key: process.env.S3_SECRET_ACCESS_KEY
    }
})

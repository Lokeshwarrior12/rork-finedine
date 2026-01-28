// internal/cache/cache.go
func Ping(ctx context.Context) error {
    _, err := RedisClient.Ping(ctx).Result()
    return err
}

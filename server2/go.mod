cd server
go mod init github.com/Lokeshwarrior12/finedine-server
go get github.com/gin-gonic/gin
go get github.com/joho/godotenv
go get github.com/redis/go-redis/v9
go get github.com/supabase-community/supabase-go  # Or official Supabase Go client
go get github.com/ulule/limiter/v3  # Rate limiting
go get github.com/ulule/limiter/v3/drivers/store/memorystore  # In-memory store (or Redis)

go get github.com/ulule/limiter/v3
go get github.com/ulule/limiter/v3/drivers/middleware/gin
go get github.com/ulule/limiter/v3/drivers/store/memorystore
go mod tidy

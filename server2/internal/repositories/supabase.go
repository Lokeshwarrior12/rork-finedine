package repositories

import (
    "os"
    supabase "github.com/supabase-community/supabase-go"
)

var Client *supabase.Client

func Init() {
    Client = supabase.NewClient(
        os.Getenv("SUPABASE_URL"),
        os.Getenv("SUPABASE_SERVICE_ROLE_KEY"), // Admin key
        nil,
    )
}

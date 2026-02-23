
package firebase

import (
	"context"
	"os"

	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func InitFirebase() (*firebase.App, error) {
	sa := os.Getenv("FIREBASE_SERVICE_ACCOUNT")
	if sa == "" {
		return nil, ErrMissingFirebaseCreds
	}

	opt := option.WithCredentialsJSON([]byte(sa))
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return nil, err
	}

	return app, nil
}

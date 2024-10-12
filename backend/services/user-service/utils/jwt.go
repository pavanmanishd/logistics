package utils

import (
    "time"
    "github.com/dgrijalva/jwt-go"
    "user-service/config"
)

func GenerateJWT(userID string) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "id":  userID,
        "exp": time.Now().Add(time.Hour * 72).Unix(),
    })

    return token.SignedString([]byte(config.JwtSecret))
}

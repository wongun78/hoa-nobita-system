terraform {
  backend "gcs" {
    bucket = "hoanobita-tfstate"
    prefix = "hoanobita-app"
  }
}

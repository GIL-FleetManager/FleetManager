## Start minikube

```bash
minikube start
```

or

```bash
minikube start --driver=docker   --extra-config=kubeadm.ignore-preflight-errors=Swap   --extra-config=kubelet.enforce-node-allocatable=""
```

## Apply manifests

```bash
kubectl apply -f kubernetes/services/ -n fleet-manager
```

## Create a global config file for environment variables

```bash
kubectl create configmap global-fleet-config --from-env-file=.env -n fleet-manager
```

## get the access token

```bash
curl -X POST 'http://localhost:8080/realms/fleet-manager/protocol/openid-connect/token' -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=password' -d 'client_id=api-gateway' -d 'client_secret=dzT2qEBxZKstFp0iZo4x0rNnhEMmjMUu' -d 'username=XXXX' -d 'password=XXXX' -d 'scope=openid'
```

change username and password with the creds of the user you created in keycloak

copy the access token and create a new header in appolo

```
Authorization: Bearer <access_token>
```

![Authorization header in appolo](../docs/images/Auth.png)

## Checking logs

for the vehicle service for example, run the following command:

```bash
kubectl logs -l app=vehicle-service -n fleet-manager -f
```

## Start the app

```bash
sh start-app.sh
```

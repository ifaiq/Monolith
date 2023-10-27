# Hypr Backend

> G-Drive documents
- [**Set up Monolith Backend**](https://docs.google.com/document/d/1F6YEcONmlW_1wx5yw183olUyxQg6V6v6)
- [**Set up Retailo Database (Dev/Stage)**](https://docs.google.com/document/d/1Pvgw005l9FZgouxIJ2eE3QqMJbXAov4Z)
- [**Set up Local/Remote (Dev/Stage) Redis**](https://docs.google.com/document/d/1vmJ1qK9n-L7DWFKmCi7OThgb8X03uOpQ)

## Steps to set up backend

<details>
  <summary>Click to expand!</summary>

For both of these two sections, refer to `Steps to set up datastore` if having issues with setting up the database.


### With Docker
<details>
  <summary>Click to expand!</summary>
<br>

1. Install Git and clone this repository
2. Install [**Retailo’s private packages**](#private-packages-installation-steps)
3. Create environment variable file (.env) as explained [**here**](#static-variables)
4. Install Docker and Docker-compose and restart your system
- **For Windows:**
  Download ***Docker Desktop for Windows***, it includes Compose along with other Docker apps, so most Windows users do not need to install Compose separately. For installation instructions, see [Install Docker Desktop on Windows](https://docs.docker.com/desktop/windows/install/).
- **For Mac:**
  Download ***Docker Desktop for Mac***, it includes Compose along with other Docker apps, so Mac users do not need to install Compose separately. For installation instructions, see [Install Docker Desktop on Mac](https://docs.docker.com/desktop/mac/install/).
- **For Linux/Ubuntu:**<br>
  Docker: <https://docs.docker.com/engine/install/ubuntu/><br>
  Docker-compose: <https://docs.docker.com/compose/install/#:~:text=Install%20Compose%20on%20Linux%20systems>
5. If you have redis-server running locally, make sure to stop it before running the app via Docker.<br>
   
   | OS                                 | Command                                               |
   |------------------------------------|-------------------------------------------------------|
   | Linux/Windows(Ubuntu Terminal)     | ```sudo service redis-server stop```                  |
   | Mac                                | ```brew services stop redis```                        |
   
6. Navigate to Hypr_Backend directory and run the following command in the terminal to start the containers in the background in detached mode
   ```
   ./runDocker.sh
   ```
   or
   ```
   GL_NPM_TOKEN=${GL_NPM_TOKEN} docker-compose up -d
   ```
   If you're using any other than bash/zsh terminal, you might need to replace ${GL_NPM_TOKEN} with the actual Git token value.
7. To get the list of running containers, run the command below
   ```
   docker ps
   ```
8. You should now be able to browse the app by navigating to http://localhost:8090
9. Run the following command to remove containers and networks created by *docker-compose up*
    ```
    docker-compose down
    ```
</details>

### Without Docker
<details>
  <summary>Click to expand!</summary>

> Note: We use npm as the default package manager for this repository.

1. Install Git and clone this repository
2. Install [**node 14**](https://nodejs.org/en/download/) and verify the versions of node and npm installed on your machine by running the below commands in the terminal <br>

   ```
   node -v
   npm -v
   ```
3. Install [**Retailo’s private packages**](#private-packages-installation-steps) 
4. Install the dependencies of the project by running the following command <br>

   ```
   npm ci
   ```

5. **IMPORTANT:** Create a new .env file at the root of hypr_backend as explained [**here**](#static-variables)
6. Install and set up the Redis server **locally** by following [**this**](#redis-installation-steps) guide
7. [Set Up Auth Variables to Run Services Locally](https://docs.google.com/document/d/1PRX1S2_AmT_YLZ_3n0AStgRH7h3S7idopUZfplwcDUg/edit#heading=h.54ie61qqf0xe)
8. Start the application with
   ```
   sails lift
   ```
9. You should now be able to browse the app by navigating to http://localhost:8080

</details>

</details>

## Steps to set up datastore

<details>
  <summary>Click to expand!</summary>

We have multiple instance of DBs running at various endpoints. We alternatively use them for various purposes. However, for the dev requirements, connecting with publicDB is the way to go. This section explains on how to connect with the publicDB using OpenVPN.

1. Collect the public DB credentials form the DB Administrator.
2. Open up .env file, and set the following variables `DB_ADDRESS`, `DB_USER`, `DB_PASSWORD` provided in step 2; and set `DB_NAME` to `stage_retailo_rewrite`.
3. Ensure that we don't have `TEST_DB_ADDRESS`, `TEST_DB_USER`, `TEST_DB_PASSWORD` and `TEST_DB_NAME` variables as they are required for the local DB instances only.

</details>

## DB Migrations

<details>
<summary>Click to expand!</summary>

### Creating/Running Migrations (JS files)

<details>
  <summary>Click to expand!</summary>
<br>

**Create:** db-migrate create *migration-name* -e *specify-environment-here* --config *configurationFilePath* <br>
**Run:** db-migrate up -e *specify-environment-here* --config *configurationFilePath*

Example:
> `cd hypr_backend/` <br>
> `db-migrate create product_multilingual_attributes -e local --config config/database.json`
</details>

### Creating/Running Migrations (SQL files)

<details>
  <summary>Click to expand!</summary>
<br>

**Create:** db-migrate create *migration-name* --sql-file -e *specify-environment-here* --config *configurationFilePath* <br>
**Run:** db-migrate up --sql-file -e *specify-environment-here* --config *configurationFilePath*

Example:
> `cd hypr_backend/` <br>
> `db-migrate create product_multilingual_attributes --sql-file -e local --config config/database.json`

</details>

</details>

## Running e2e tests
<details>
<summary>Click to expand!</summary>

### With Docker
The recommened way of running e2e tests is with docker. The tests can be executed by running the commands provided below, the command will take care spinning the containers, creating the database, running the tests, dropping the database and finally removing the test containers.

> `cp .env.localDocker .env` <br>
> `npm run test:e2e:local`

### Without Docker

Make sure to copy test db environment variables from the `.env.template` file and provide the credentials point to your local test database.

> `npm run test:e2e`
</details>

## Kibana Logs

<details>
  <summary>Click to expand!</summary>

<br>You can access Kibana logs by navigating to respective env from below (VPN must be connected)

> [Dev](https://dev2kibana.retailo.me/_dashboards/app/discover#/)<br>
> [Stage](https://stage2kibana.retailo.me/_dashboards/app/discover#/)<br>
> [Production](https://prod2kibana.retailo.me/_dashboards/app/discover#/)<br>

</details>

## Private Packages Installation Steps
<details>
<summary>Click to expand!</summary>

 ### Prerequisties
 - Access to the package’s repository

### Procedure
- Create your [**personal access token**](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) (PAT) with allowed scope(s) of `API`.<br>
- Add GL_NPM_TOKEN to the environment variables<br>
  
  | OS                     | Command                                               |
  |----------------------- |-------------------------------------------------------|
  | Linux/Mac              | ```export GL_NPM_TOKEN=place-your-Git-PAT-here```  |
  | Windows (GitBash)      | ```setx GL_NPM_TOKEN place-your-Git-PAT-here```    |

- Add below to your .bashrc/.zshrc file to ensure it’s available in new shell sessions 
  ```
  export GL_NPM_TOKEN=place-your-Git-PAT-here
  ```
  If you are using MacOS or Windows Subsystem for Linux, the .bashrc file may not yet exist, you can create one by running the following command and restart the terminal
  ```
  copy > ~/.bashrc
  ```
- Reload the bash file<br>
  
  | Shell         | Command                 |
  |---------------|-------------------------|
  | Gitbash       | ```source ~/.bashrc```  |
  | Z shell (zsh) | ```source ~/.zshrc```   |
  
- Create a system level NPM resource file by running the following commands
  ```
  npm config set @development-team20:registry=https://gitlab.com/api/v4/packages/npm/
  ```
  ```
  npm config set '//gitlab.com/api/v4/packages/npm/:_authToken=${GL_NPM_TOKEN}'
  ```
</details>

## Redis Installation Steps

<details>
<summary>
    Windows 10 and higher versions
</summary>

#### Prerequisties

- Install and connect [**OpenVPN Connect**](#openvpn-connection)
- Install Latest Ubuntu LTS version from Microsoft Store

#### Set up guide

- Make sure you're running Windows 10 or a higher version to follow this set up guide
- Go to **Turn off Windows features on or off** from Search and mark the checkbox `Windows SubSystem for Linux`.
- Restart your computer
- Open **Ubuntu LTS** that you installed earlier on your machine, it will ask for login information on first use
- Add a repository before installing Redis via Ubuntu Terminal

    ```
    sudo apt-add-repository ppa:redislabs/redis 
    ```

- Update and upgrade the Linux package manager. Note: UPGRADE might take long.

    ```
    sudo apt-get update
    sudo apt-get upgrade
    ```

- Run the following command in Ubuntu terminal to install Redis

    ```
    sudo apt-get install redis-server 
    ```

- Check the version of installed redis server by running the following command

    ```
    redis-server --version 
    ```

- Restart the Redis server to make sure it is running:

    ```
    sudo service redis-server restart 
    ```

- To stop your Redis server

  ```
  sudo service redis-server stop

  OR

  /etc/init.d/redis-server stop
  ```

- To start your Redis server

    ```
    sudo service redis-server start

    OR
    
    /etc/init.d/redis-server start
    ```

</details>

<details>
<summary>
    Unix/Mac OS
</summary>

Follow the steps mentioned in the [**URL**](https://developer.redis.com/create/homebrew/) below to install/setup Redis locally on Mac OS.

</details>


## OpenVPN Connection
<details>

<summary>Click to expand!</summary>
<br>

- Download OpenVPN Connect from [**here**](https://openvpn.net/vpn-client/) 
- Install it on your system with default configurations
- Once installed, open the client and type https://retailo.openvpn.com in the URL section
- You will be redirected to google login page, use your Retailo's account to login
- Select Amsterdam as the region
- On the next page, mark the checkbox **Connect after import** and click on the **add** button in the top right corner
- To confirm your VPN connection, visit https://whatismyipaddress.com/ and see the ipv4 address, if it's 15.184.159.147, you have successfully connected to the VPN
- Please check with the DevOps team if you're facing any issues

</details>

## Development Notes

<details>
<summary>Environment Variables</summary>

### Static Variables
We are using **Dotenv** module which loads environment variables from a .env file into `process.env`
- Create an `.env.*` file at the root directory according to [**.env.template**](hypr_backend/.env.template)
- Environment variables from multiple files, (i.e. `.env`, `.env.development`, `.env.staging`, `.env.production`, \
  and `.env.qa`) can be loaded according to your target environment.
- .env file can be modified to introduce new variables
- **IMPORTANT: Don't commit your .env file to version control.**

</details>
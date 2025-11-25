# PharmaSuccess - A React & PHP Online Testing Platform

This project is a complete online testing application with a React frontend and a PHP backend.

## Backend Setup Instructions

To get the backend working, please follow these steps carefully.

### Step 1: Configure Database Credentials

The backend needs to connect to your database. Your credentials are kept in a `config.php` file, which is not included in the repository for security reasons.

1.  **Locate the Example File:** In the `backend/` directory, you will find a file named `config.example.php`.
2.  **Create Your Configuration File:** Make a copy of `config.example.php` and rename the copy to `config.php`.
3.  **Enter Your Credentials:** Open the new `backend/config.php` file and fill in your Hostinger database details:
    *   `DB_HOST`: `localhost` (usually correct for Hostinger)
    *   `DB_NAME`: `u631305858_test`
    *   `DB_USER`: `u631305858_shoaib`
    *   `DB_PASS`: `Sk@001001`

### Step 2: Set Up the Database Tables

The application requires a specific set of tables in your database. An installation script is provided to create these for you.

1.  **Run the Installer:** Open your web browser and navigate to the `install.php` script on your server. For example: `http://yourdomain.com/backend/install.php`
2.  **Verify the Output:** The script should run and display a series of success messages, indicating that the tables were created and sample data was inserted.
3.  **Confirm Default Logins:** The script will provide you with default login credentials for both an admin and a student account.

### Step 3: Secure Your Application (IMPORTANT)

After the installation is complete, you must secure your application to prevent unauthorized access and protect your data.

1.  **DELETE THE INSTALL SCRIPT:** Using your file manager or an FTP client, **delete the `backend/install.php` file** from your server. Leaving this file on your server is a major security risk, as it could allow someone to reset your entire database.

Your backend is now fully configured and ready to be used with the frontend application.

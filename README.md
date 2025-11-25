# PharmaSuccess - A React & PHP Online Testing Platform

This project is a complete online testing application with a React frontend and a PHP backend.

## !!! IMPORTANT SECURITY WARNING !!!

This project is delivered with your database credentials pre-configured in the `backend/config.php` file to ensure it works "out of the box" as requested.

**This is a significant security risk.** Storing plaintext passwords in your code is strongly discouraged in a production environment. If your source code is ever exposed, your database will be compromised.

**Recommended Actions After Deployment:**

1.  **Restrict File Access:** Ensure your web server is configured to prevent web access to the `backend/` directory, except for the `backend/api/` subdirectory. The included `.htaccess` file is designed to do this, but you should verify it works on your Hostinger environment.
2.  **Move to Environment Variables:** The most secure method for handling credentials is to use environment variables, which are not stored with your code. Please consult Hostinger's documentation on how to set these up for your PHP application.
3.  **Delete `install.php`:** After you have successfully set up your database, you **must delete the `backend/install.php` file**. Leaving it on your server creates a vulnerability that could allow an attacker to wipe your database.

## Backend Setup Instructions

1.  **Upload Files:** Upload all the project files to your Hostinger server's `public_html` directory.
2.  **Run the Installer:** In your web browser, navigate to the `install.php` script to set up your database. For example: `http://yourdomain.com/backend/install.php`
3.  **DELETE THE INSTALLER:** Once the installation is complete, **immediately delete the `backend/install.php` file**.

Your backend is now fully configured.

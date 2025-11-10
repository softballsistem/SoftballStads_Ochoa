# SoftballStads Ochoa

This project is a softball statistics tracking application. It allows users to manage teams, players, games, and player statistics.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/SoftballStads_Ochoa.git
    cd SoftballStads_Ochoa
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following environment variables. You can get these from your Supabase project settings.

    ```
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    ```

### Usage

-   **Run the development server:**
    ```sh
    npm run dev
    ```
    This will start the application in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

-   **Build for production:**
    ```sh
    npm run build
    ```
    This will build the application for production to the `dist` folder.

-   **Lint the code:**
    ```sh
    npm run lint
    ```

---

## Database Schema

### Tables

-   **teams:** Softball teams
-   **players:** Players
-   **games:** Games/Matches
-   **player_stats:** Player statistics per game
-   **user_profiles:** User profiles
-   **role_change_requests:** Role change requests

### Security

-   RLS enabled on all tables
-   Specific policies per role
-   Timestamp update function
-   Indexes for query optimization

### Team Logos

-   The `teams` table has a `logo_url` column to store the URL of the team logo.
-   A Supabase Storage bucket is used to store the team logos.

### Role Change Requests

-   The `role_change_requests` table is used to manage role change requests from users.
-   RLS is enabled on this table with policies for developers and administrators.
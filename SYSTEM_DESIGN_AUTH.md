# System Architecture & Authentication Logic

## 1. System Architecture
The application utilizes a serverless architecture based on **Firebase**, leveraging its core services to ensure distinct separation of concerns and data security.

*   **Frontend**: React (Vite) Single Page Application (SPA) serving as the UI client.
*   **Authentication**: Firebase Authentication for managing user identity (Email/Password).
*   **Database**: Cloud Firestore (NoSQL) for storing `Teams`, `Users`, and relational data.
*   **State Management**: React Context / Hooks for managing session state (`user`, `team`).

## 2. Database Structure

### `teams` Collection
Stores the verified organization units.
```json
{
  "id": "team_unique_id",
  "name": "Alpha Squad",
  "passkey": "A8X92L1Z",  // Shared secret for joining the team
  "leaderId": "user_uid_of_leader",
  "createdAt": 170000000000
}
```

### `users` Collection
Stores personnel profiles.
```json
{
  "id": "firebase_auth_uid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "ADMIN" | "TEAM_LEADER" | "MEMBER",
  "teamId": "team_unique_id", // Link to the Team
  "isActive": true,
  "isApproved": true
}
```

## 3. Authentication & Passkey Logic

### flow A: Team Leader Registration (Initialization)
1.  **Input**: Name, Email, Password, Team Name.
2.  **Process**:
    *   System checks if `Team Name` is unique.
    *   System creates a new `Team` document.
    *   System **automatically generates** a unique 8-character alphanumeric `passkey` for the team.
    *   System creates the User account (Firebase Auth) and User Profile (Firestore) with usage of `TEAM_LEADER` role.
3.  **Output**: User automatically logged in. Passkey displayed to Leader (simulating email delivery).

### flow B: Team Member Registration (Joining)
1.  **Input**: Name, Email, Password, Team Name, **Team Passkey**.
2.  **Validation**:
    *   Query `teams` collection where `name` == Input Team Name AND `passkey` == Input Passkey.
    *   If no match -> **Reject Registration**.
    *   If match -> Retrieve `teamId`.
3.  **Process**:
    *   Create User account linked to the retrieved `teamId` with `MEMBER` role.
4.  **Output**: User successfully registered and logged in.

### flow C: Regular Login (Leaders & Members)
1.  **Input**: Email, Password. (**No Passkey required**)
2.  **Process**:
    *   Authenticate against Firebase Auth.
    *   Fetch User Profile from Firestore.
    *   Check `isActive` status.
    *   (Optional) Check `isApproved` status.
3.  **Access Control**:
    *   The frontend directs the user to the Dashboard.
    *   Data queries are strictly scoped to `where("teamId", "==", user.teamId)`.

## 4. Role-Based Access Control (RBAC)

| Feature | Admin (Global) | Team Leader | Member |
| :--- | :---: | :---: | :---: |
| **Login** | Email + Password | Email + Password | Email + Password |
| **View Team Data** | All Teams | Own Team Only | Own Team Only |
| **Manage Members** | Global Approval | Team Approval | View Only |
| **Create Polls** | Yes | Yes | Vote Only |
| **Manage Team** | Full Control | Rotate Passkey | N/A |

## 5. Security Rules (Firestore)
*   **Write**: Only authenticated users can write to their own profile.
*   **Read**: Users can only read documents where `resource.data.teamId == request.auth.token.teamId`.
*   **Team Write**: Only Leaders can update their Team document (e.g. rotating passkey).

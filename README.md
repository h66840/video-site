# Video Site

A modern video streaming platform with DApp integration.

## Features

- Video streaming and management
- User authentication and profiles
- DApp integration for blockchain features
- Real-time comments and interactions

## Database Functions

### User Management

#### `get_user_id_by_email(p_email VARCHAR(255))`

**Purpose**: Retrieves a user's account ID by their email address for DApp user system integration.

**Parameters**:
- `p_email` (VARCHAR(255)): The email address to search for

**Returns**: 
- `INTEGER`: The user ID if found, or `NULL` if no user exists with the given email

**Usage Example**:
```sql
-- Get user ID for a specific email
SELECT get_user_id_by_email('alice@example.com');
-- Returns: 1 (if user exists) or NULL (if not found)

-- Use in application queries
SELECT u.username, u.created_at 
FROM users u 
WHERE u.user_id = get_user_id_by_email('bob@dapp.io');
```

**Implementation Details**:
- Function uses a simple SELECT query with LIMIT 1 for optimal performance
- Email lookup is case-sensitive
- Returns immediately upon finding a match
- Safe to use in concurrent environments

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the database with required tables and functions
4. Configure environment variables
5. Run the application: `npm start`

## Database Setup

The application requires a PostgreSQL database with the following tables:
- `users`: Stores user account information including email and user ID

Run the following SQL to create the user lookup function:

```sql
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email VARCHAR(255))
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT user_id 
        FROM users 
        WHERE email = p_email
        LIMIT 1
    );
END;
$$;
```

## API Endpoints

- `/api/users` - User management
- `/api/videos` - Video operations
- `/api/auth` - Authentication

## Contributing

1. Fork the repository
2. Create a feature branch from `dev`
3. Make your changes
4. Submit a pull request

## License

MIT License
const express = require('express');
const  Pool  = require('pg').Pool;

const app = express();
const port = 3000;

// Create PostgreSQL pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cricbuzz',
    password: '1234',
    port: 5432,
});

// Middleware
app.use(express.json());

// Endpoint for registering a user
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        
        pool.query(
            'INSERT INTO public."Users"(username, email, password) VALUES($1, $2, $3)', [username,email, password],
            
            (err, result) => {
              if (err) {
                
                throw err;
              }
              res.status(200).json({ message: 'User registered successfully' });
            }
          );

    } catch (err) {
        res.status(500).json({ error: err.message });
    }


});

// Endpoint for user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        pool.query(
            'SELECT * FROM public."Users" WHERE username = $1 AND password = $2', [username, password],
            
            (err, result) => {
              if (err) {
                throw err;
              }
              if (result.rows.length > 0) {
                res.status(200).json({ message: 'Login successful' });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
              
            }
          );

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint for creating a match
app.post('/matches/create', async (req, res) => {
    const { team_1, team_2, date, venue } = req.body;

    try {
        pool.query(
            'INSERT INTO public."Matches"(team_1, team_2, date, venue) VALUES($1, $2, $3, $4)', [team_1, team_2, date, venue],          
            (err, result) => {
              if (err) {
                
                throw err;
              }
              res.status(200).json({ message: 'Match registered successfully' });
            }
          );
 

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint for getting all match schedules
app.get('/matches', async (req, res) => {
    try {
        pool.query(
            'SELECT match_id, team_1, team_2, to_char(date, \'YYYY-MM-DD\') AS date, venue from  public."Matches"',        
            (err, result) => {
              if (err) {
                
                throw err;
              }
              
              res.status(200).json(result.rows);
            }
          );
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/teams/:teamId/squad', async (req, res) => {
  const teamId = req.params.teamId;
 
  const { role, name } = req.body;

  try {
      // Check if the team exists
      const teamQuery = 'SELECT * FROM public."Teams" WHERE team_id = $1';
      const teamResult = await pool.query(teamQuery, [teamId]);
      if (teamResult.rows.length === 0) {
          return res.status(404).json({ error: 'Team not found' });
      }

      // Update player details
      const updatePlayerQuery = 'UPDATE public."Players" SET role = $1,team_id = $3  WHERE name = $2';
      const updateResult = await pool.query(updatePlayerQuery, [role, name, teamId]);
      if (updateResult.rowCount === 0) {
          return res.status(404).json({ error: 'Player not found in the specified team' });
      }

      res.status(200).json({ message: 'Player added to Team successfully' });
  } catch (err) {
      console.error('Error updating player details:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

//This api needs to be checked out
app.get('/matches/:matchId', async (req, res) => {
  const matchId = req.params.matchId;

  try {
      // Query to fetch match details and player details for both teams
      const query = `SELECT 
      m.match_id, 
      m.team_1, 
      t1.team_name AS team1_name, 
      m.team_2, 
      t2.team_name AS team2_name, 
      m.date, 
      m.venue,
      p1.player_id AS team1_player_id, 
      p1.name AS team1_player_name,
      p2.player_id AS team2_player_id, 
      p2.name AS team2_player_name
  FROM 
      Matches m
  INNER JOIN 
      Teams t1 ON m.team_1 = t1.team_name
  INNER JOIN 
      Teams t2 ON m.team_2 = t2.team_name
  LEFT JOIN 
      Players p1 ON t1.team_id = p1.team_id
  LEFT JOIN 
      Players p2 ON t2.team_id = p2.team_id
  WHERE 
      m.match_id = $1;`
      
      // Execute the query
      const result = await pool.query(query, [matchId]);
      const matchDetails = result.rows[0];
      
      // Check if match details exist
      if (!matchDetails) {
          return res.status(404).json({ error: 'Match not found' });
      }
      
      // Return the match details
      res.status(200).json({ matchDetails });
  } catch (err) {
      console.error('Error fetching match details:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});






    // `
    //       SELECT 
    //           m.match_id, m.team_1, t1.team_name AS team1_name, 
    //           m.team_2, t2.team_name AS team2_name, 
    //           m.date, m.venue,
    //           p1.player_id AS team1_player_id, p1.name AS team1_player_name,
    //           p2.player_id AS team2_player_id, p2.name AS team2_player_name
    //       FROM 
    //           Matches m
    //       INNER JOIN 
    //           Teams t1 ON m.team_1 = t1.team_name
    //       INNER JOIN 
    //           Teams t2 ON m.team_2 = t2.team_name
    //       LEFT JOIN 
    //           Players p1 ON m.team_1 = p1.team_id
    //       LEFT JOIN 
    //           Players p2 ON m.team_2 = p2.team_id
    //       WHERE 
    //           m.match_id = $1
    //   `;
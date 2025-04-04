// load express
const express = require('express');

//load fs to read files
const fs = require('fs');

//create app
const app = express();

//Use files in the 'public' folder
app.use(express.static('public'));

//Route to the projects
app.get('/api/projects', (req, res) =>
	{
		fs.readFile('./data/projects.json', 'utf8', (err, data) =>
			{
				if (err)
				{
					return res.status(500).json({error: 'JSON File reading Error'});
				}
				res.json(JSON.parse(data));
			});
	});

//listen on port 3000
const port = 3000
app.listen(port, ()=> 
	{
		console.log('Serveur online at http://localhost:${port}');
	});

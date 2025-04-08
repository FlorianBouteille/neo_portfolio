// load express
const express = require('express');
const engine = require('ejs-mate');
//load fs to read files
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const ADMIN_PASSWORD = 'tagazok';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom du fichier avec timestamp
  }
});

const upload = multer({ storage: storage });

//create app
const app = express();
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//Use files in the 'public' folder
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

const session = require('express-session');

app.use(session({
  secret: 'une-cle-secrete-bien-longue',
  resave: false,
  saveUninitialized: false
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
}

//Route to the projects

app.get('/', (req, res) => {
	res.render('index', { pageTitle: 'Mon Portfolio' });
});

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

app.get('/projects', (req, res) => {
  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    const projects = JSON.parse(data);
    
	console.log("coucou");
	res.render('projects', {projects: projects, 
							pageTitle: 'Mes Projets'});
  });
});

app.get('/projects/:title', (req, res) => {
  const { title } = req.params; // Récupérer le titre du projet depuis l'URL

  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    const projects = JSON.parse(data);
    const project = projects.find(p => p.title === title); // Trouver le projet correspondant au titre

    if (!project) {
      return res.status(404).send('Projet non trouvé.');
    }
	console.log(project.title);
    res.render('project', { project,
							pageTitle: project.title })						
	}); // Rendre la vue 'project.ejs' en passant les données du projet
  });

app.get('/admin', requireAdmin, (req, res) => {
  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    const projects = JSON.parse(data);
    res.render('admin', { projects, pageTitle: 'Admin' }); // Passe les projets à la vue
  });
});

app.post('/admin', requireAdmin, upload.single('image'), (req, res) => {
  const { title, description, date, url } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : ''; // Enregistrer le chemin relatif de l'image

  // Ajouter le projet à ton fichier JSON (ou base de données)
  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    const projects = JSON.parse(data);
    const newProject = {
      title,
      description,
      date,
      url,
      image
    };

    projects.push(newProject);

    // Sauvegarder les projets mis à jour
    fs.writeFile('./data/projects.json', JSON.stringify(projects, null, 2), (err) => {
      if (err) return res.status(500).send('Erreur de sauvegarde du projet.');
      res.redirect('/projects'); // Rediriger vers la page des projets
    });
  });
});

app.post('/admin/delete/:title', requireAdmin, (req, res) => {
  const { title } = req.params; // Récupère le titre du projet depuis l'URL

  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    let projects = JSON.parse(data);
    projects = projects.filter(project => project.title !== title); // Filtrer le projet à supprimer

    // Sauvegarder les projets mis à jour dans le fichier JSON
    fs.writeFile('./data/projects.json', JSON.stringify(projects, null, 2), (err) => {
      if (err) return res.status(500).send('Erreur de sauvegarde du fichier projets.');

      res.redirect('/admin'); // Rediriger vers la page admin après la suppression
    });
  });
});

app.get('/admin/edit/:title', requireAdmin, (req, res) => {
  const title = req.params.title;

  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    const projects = JSON.parse(data);
    const project = projects.find(p => p.title === title);

    if (!project) return res.status(404).send('Projet non trouvé.');

    res.render('edit', { project, pageTitle: 'Edit projects' });
  });
});

app.post('/admin/edit/:title', requireAdmin, (req, res) => {
  const originalTitle = req.params.title;
  const { title, description, date, url } = req.body;

  fs.readFile('./data/projects.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur de lecture du fichier projets.');

    let projects = JSON.parse(data);
    const projectIndex = projects.findIndex(p => p.title === originalTitle);

    if (projectIndex === -1) return res.status(404).send('Projet non trouvé.');

    // Mettre à jour les infos
    projects[projectIndex] = {
      ...projects[projectIndex],
      title,
      description,
      date,
      url
    };

    fs.writeFile('./data/projects.json', JSON.stringify(projects, null, 2), (err) => {
      if (err) return res.status(500).send('Erreur de mise à jour du projet.');
      res.redirect('/admin');
    });
  });
});

app.get('/login', (req, res) => {
  res.render('login', { pageTitle : 'Login' });
});

app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.send('Mot de passe incorrect');
  }
});

//listen on port 3000
const port = 3000
app.listen(port, ()=> 
	{
		console.log('Serveur online at http://localhost:${port}');
	});

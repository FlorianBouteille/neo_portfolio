document.addEventListener('DOMContentLoaded', async () => {
  const wrapper = document.getElementById('projects-wrapper');
  if (!wrapper) return;

  const typeClassMap = {
    '42': 'projectType42',
    graphic: 'projectTypeGraphic',
    graphics: 'projectTypeGraphic',
    game: 'projectTypeGame',
    other: 'projectTypeOther'
  };

  const colors = ['color1', 'color2', 'color3'];

  try {
    const response = await fetch('/data/projects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load projects data.');

    const payload = await response.json();
    const projects = Array.isArray(payload) ? payload : payload.projects || [];

    projects.forEach((project) => {
      const projectType = (project.type || '').toLowerCase();
      const typeClass = typeClassMap[projectType] || 'projectTypeOther';
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const item = document.createElement('li');
      item.className = `projectBubble ${typeClass}`;
      item.dataset.url = `/project?title=${encodeURIComponent(project.title)}`;

      const circle = document.createElement('div');
      circle.className = `circleContent ${randomColor}`;
      circle.style.backgroundImage = `url('${project.image}')`;

      const title = document.createElement('h2');
      title.className = 'electrolize-regular';
      title.textContent = project.title;

      circle.appendChild(title);
      item.appendChild(circle);
      wrapper.appendChild(item);
    });

    document.dispatchEvent(
      new CustomEvent('projects:loaded', {
        detail: { count: projects.length }
      })
    );
  } catch (error) {
    const fallback = document.createElement('p');
    fallback.className = 'electrolize-regular';
    fallback.textContent = 'Impossible de charger les projets pour le moment.';
    wrapper.replaceWith(fallback);
  }
});

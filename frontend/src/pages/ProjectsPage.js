// src/pages/ProjectsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects();
        setProjects(response.data);
      } catch (err) {
        console.error('Błąd pobierania projektów:', err);
        setError('Nie udało się pobrać projektów. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Ładowanie projektów...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="projects-page">
      <div className="header-actions">
        <h1>Projekty</h1>
        <Link to="/projects/new" className="btn btn-primary">Nowy projekt</Link>
      </div>

      {projects.length === 0 ? (
        <p>Nie masz jeszcze żadnych projektów.</p>
      ) : (
        <div className="projects-list">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.name}</h3>
              <p>Lokalizacja: {project.localization}</p>
              <p>Status: {project.status_display}</p>
              <Link to={`/projects/${project.id}`} className="btn">Zobacz szczegóły</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
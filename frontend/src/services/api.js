// src/services/api.js
import axios from 'axios';

// Tworzymy instancję axios z bazowym URL
const API = axios.create({
  baseURL: '/api',  // Używamy względnych URL-i
});

// Interceptor dla tokenów uwierzytelniających (jeśli będziesz używać)
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// API dla użytkowników
export const getCurrentUser = () => {
  return API.get('/users/me/');
};

export const getUserProfile = () => {
  return API.get('/profiles/my_profile/');
};

// API dla projektów
export const getProjects = () => {
  return API.get('/projects/');
};

export const getProjectById = (id) => {
  return API.get(`/projects/${id}/`);
};

export const createProject = (data) => {
  return API.post('/projects/', data);
};

export const updateProject = (id, data) => {
  return API.patch(`/projects/${id}/`, data);
};

export const deleteProject = (id) => {
  return API.delete(`/projects/${id}/`);
};

export const getClients = () => {
  return API.get('/clients/');
};

export const getClientById = (id) => {
  return API.get(`/clients/${id}/`);
};

export const createClient = (data) => {
  return API.post('/clients/', data);
};

export const updateClient = (id, data) => {
  return API.patch(`/clients/${id}/`, data);
};

export const deleteClient = (id) => {
  return API.delete(`/clients/${id}/`);
};

export default API;
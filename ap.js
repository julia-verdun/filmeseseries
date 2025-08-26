const API_KEY = '9e2a7cd0f4bb43e84d8c571ec4c482e7';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const moviesList = document.getElementById('moviesList');
const movieDetails = document.getElementById('movieDetails');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Botões do menu
const homeBtn = document.getElementById('homeBtn');
const moviesBtn = document.getElementById('moviesBtn');
const seriesBtn = document.getElementById('seriesBtn');

async function fetchMovies(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Dados recebidos:', data.results);
    return data.results;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return [];
  }
}

function getMovieTitle(movie) {
  return movie.title || movie.name || 'Sem título';
}

function filterValidMovies(movies) {
  // Filtra só os filmes/séries que tenham poster_path ou backdrop_path e título
  return movies.filter(m => (m.poster_path || m.backdrop_path) && getMovieTitle(m) !== 'Sem título');
}

function createMovieCard(movie) {
  const card = document.createElement('div');
  card.classList.add('movie-card');
  card.innerHTML = `
    <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${getMovieTitle(movie)}" />
    <div class="movie-info">
      <h3 class="movie-title">${getMovieTitle(movie)}</h3>
      <p class="movie-rating">⭐ ${movie.vote_average}</p>
    </div>
  `;
  card.addEventListener('click', () => showMovieDetails(movie));
  return card;
}

async function showMovies(movies) {
  moviesList.innerHTML = '';
  movieDetails.classList.add('hidden');
  moviesList.classList.remove('hidden');

  const validMovies = filterValidMovies(movies);
  if (validMovies.length === 0) {
    moviesList.innerHTML = '<p>Nenhum resultado encontrado.</p>';
    return;
  }

  validMovies.forEach(movie => {
    const card = createMovieCard(movie);
    moviesList.appendChild(card);
  });
}

async function showMovieDetails(movie) {
  movieDetails.innerHTML = `
    <h2>${getMovieTitle(movie)}</h2>
    <p><strong>Lançamento:</strong> ${movie.release_date || movie.first_air_date || '---'}</p>
    <p><strong>Avaliação:</strong> ⭐ ${movie.vote_average}</p>
    <p><strong>Sinopse:</strong> ${movie.overview}</p>
    <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${getMovieTitle(movie)}" style="width: 200px; margin-top: 10px;" />
  `;
  movieDetails.classList.remove('hidden');
}

// ===== Carregamento inicial =====
async function loadPopularMovies() {
  const movies = await fetchMovies(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`);
  showMovies(movies);
}

async function loadPopularSeries() {
  const series = await fetchMovies(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR&page=1`);
  // Adapta título para séries
  series.forEach(s => s.title = s.name);
  showMovies(series);
}

// ===== Pesquisa =====
async function searchMoviesAndSeries() {
  const query = searchInput.value.trim();
  if (!query) return;

  const movies = await fetchMovies(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);
  const series = await fetchMovies(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);

  // Adapta título para séries
  series.forEach(s => s.title = s.name);

  showMovies([...movies, ...series]);
}

// Eventos do menu
homeBtn.addEventListener('click', loadPopularMovies);
moviesBtn.addEventListener('click', loadPopularMovies);
seriesBtn.addEventListener('click', loadPopularSeries);

// Eventos da pesquisa
searchBtn.addEventListener('click', searchMoviesAndSeries);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchMoviesAndSeries();
  }
});

// Inicial
loadPopularMovies();

// ===== LOGIN SIMPLES =====
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const submitLogin = document.getElementById('submitLogin');

loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

closeLogin.addEventListener('click', () => {
  loginModal.classList.add('hidden');
});

submitLogin.addEventListener('click', () => {
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (username && password) {
    localStorage.setItem('user', username);
    alert("Bem-vindo, " + username + "!");
    loginModal.classList.add('hidden');
    loginBtn.textContent = "👤 " + username;
  } else {
    alert("Preencha todos os campos!");
  }
});

// Mantém login ao recarregar
window.addEventListener('load', () => {
  const savedUser = localStorage.getItem('user');;
  if (savedUser) {
    loginBtn.textContent = "👤 " + savedUser;
  }
});

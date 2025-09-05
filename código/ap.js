const API_KEY = '9e2a7cd0f4bb43e84d8c571ec4c482e7';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const moviesList = document.getElementById('moviesList');
const movieDetails = document.getElementById('movieDetails');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Menu
const homeBtn = document.getElementById('homeBtn');
const moviesBtn = document.getElementById('moviesBtn');
const seriesBtn = document.getElementById('seriesBtn');

// ===== API TMDB - Buscar filmes/séries =====
async function fetchMovies(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return [];
  }
}

// ===== Buscar trailer no YouTube (TMDB) =====
async function fetchTrailer(item) {
  try {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const url = `${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=pt-BR`;
    const res = await fetch(url);
    const data = await res.json();
    const trailers = data.results.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    return trailers.length > 0 ? trailers[0].key : null;
  } catch (error) {
    console.error('Erro ao buscar trailer:', error);
    return null;
  }
}

// ===== Buscar plataformas de streaming (TMDB) =====
async function fetchStreamingPlatforms(item) {
  try {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const url = `${BASE_URL}/${type}/${item.id}/watch/providers?api_key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const br = data.results?.BR;
    if (!br || !br.flatrate) return [];
    return br.flatrate.map(provider => ({
      name: provider.provider_name,
      logo: `https://image.tmdb.org/t/p/w45${provider.logo_path}`
    }));
  } catch (error) {
    console.error('Erro ao buscar plataformas:', error);
    return [];
  }
}

// ===== Título =====
function getMovieTitle(movie) {
  return movie.title || movie.name || 'Sem título';
}

// ===== Valida dados =====
function filterValidMovies(movies) {
  return movies.filter(m => (m.poster_path || m.backdrop_path) && getMovieTitle(m) !== 'Sem título');
}

// ===== Criar card de filme/série =====
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

// ===== Mostrar lista de filmes/séries =====
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

// ===== Mostrar detalhes com trailer e streaming =====
async function showMovieDetails(movie) {
  movieDetails.innerHTML = `
    <h2>${getMovieTitle(movie)}</h2>
    <p><strong>Lançamento:</strong> ${movie.release_date || movie.first_air_date || '---'}</p>
    <p><strong>Avaliação:</strong> ⭐ ${movie.vote_average}</p>
    <p><strong>Sinopse:</strong> ${movie.overview}</p>
    <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${getMovieTitle(movie)}" style="width: 200px; margin-top: 10px;" />
    <div id="trailerContainer" style="margin-top: 20px;">Carregando trailer...</div>
    <div id="platformsContainer" style="margin-top: 20px;">Buscando plataformas...</div>
    <button id="backBtn" style="margin-top: 20px;">Voltar</button>
  `;

  // Trailer
  const trailerKey = await fetchTrailer(movie);
  const trailerContainer = document.getElementById('trailerContainer');
  if (trailerKey) {
    trailerContainer.innerHTML = `
      <iframe 
        width="100%" 
        height="315" 
        src="https://www.youtube.com/embed/${trailerKey}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
  } else {
    trailerContainer.innerHTML = '<p>Trailer não disponível.</p>';
  }

  // Plataformas
  const providers = await fetchStreamingPlatforms(movie);
  const platformsContainer = document.getElementById('platformsContainer');
  if (providers.length > 0) {
    platformsContainer.innerHTML = `
      <h4>Disponível em:</h4>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${providers.map(p => `
          <div style="text-align: center;">
            <img src="${p.logo}" alt="${p.name}" title="${p.name}" style="width: 45px; height: 45px;" />
            <div style="font-size: 12px;">${p.name}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    platformsContainer.innerHTML = '<p><strong>Disponível em:</strong> Não encontrado para streaming no Brasil.</p>';
  }

  movieDetails.classList.remove('hidden');
  moviesList.classList.add('hidden');

  document.getElementById('backBtn').addEventListener('click', () => {
    movieDetails.classList.add('hidden');
    moviesList.classList.remove('hidden');
  });
}

// ===== Carregamento inicial =====
async function loadPopularMovies() {
  const movies = await fetchMovies(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`);
  showMovies(movies);
}

async function loadPopularSeries() {
  const series = await fetchMovies(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR&page=1`);
  series.forEach(s => s.title = s.name);
  showMovies(series);
}

// ===== Pesquisa =====
async function searchMoviesAndSeries() {
  const query = searchInput.value.trim();
  if (!query) return;

  const movies = await fetchMovies(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);
  const series = await fetchMovies(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);

  series.forEach(s => s.title = s.name);
  showMovies([...movies, ...series]);
}

// ===== Buscar filmes por gênero =====
async function loadMoviesByGenre(genreId) {
  let url = '';
  if (genreId === 'all') {
    // Todos os filmes populares
    url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`;
  } else {
    // Filmes filtrados pelo gênero
    url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=pt-BR&page=1`;
  }
  const movies = await fetchMovies(url);
  showMovies(movies);
}

// ===== Eventos para botões de gênero =====
const genreButtons = document.querySelectorAll('.genre-btn');
genreButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove active de todos
    genreButtons.forEach(btn => btn.classList.remove('active'));
    // Adiciona active no clicado
    button.classList.add('active');

    const genreId = button.getAttribute('data-genre');
    loadMoviesByGenre(genreId);
  });
});

// ===== Eventos =====
homeBtn.addEventListener('click', loadPopularMovies);
moviesBtn.addEventListener('click', loadPopularMovies);
seriesBtn.addEventListener('click', loadPopularSeries);
searchBtn.addEventListener('click', searchMoviesAndSeries);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchMoviesAndSeries();
  }
});

// ===== Inicial =====
loadMoviesByGenre('all');

// ===== LOGIN =====
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

window.addEventListener('load', () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    loginBtn.textContent = "👤 " + savedUser;
  }
});

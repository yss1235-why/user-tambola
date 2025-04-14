#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem; /* Reduced padding for mobile */
  text-align: center;
}

@media (min-width: 640px) {
  #root {
    padding: 2rem; /* Original padding for larger screens */
  }
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 1.5em; /* Reduced from 2em */
}

.read-the-docs {
  color: #888;
}

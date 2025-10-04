/* Define the icon font */
@font-face {
  font-family: 'x-icons';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v134/kJF4BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzBwG-RpA6RzaxHMPdY40KH8nGzv3fzfVJU22ZZLsYEpzC_1ver5Y0J1Llf.woff2) format('woff2');
}

/* Define a custom icon tag */
x-icon::before {
  font-family: 'x-icons';
  content: attr(name);
  -webkit-font-smoothing: antialiased;
}

/* Filled variation */
x-icon[fill]::before {
  font-variation-settings: 'FILL' 1;
}


<x-icon name="person"></x-icon>
<x-icon name="person" fill></x-icon>
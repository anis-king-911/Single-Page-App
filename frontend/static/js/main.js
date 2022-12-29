let mangaList, recentManga, url = './static/data/newData.json';

function getJSON(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = () => {
    const status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
}

const listItem = ({ ID, Title, Cover, Count, Type, State }) => {
  return `
<article>
  <div class="ID">${ID.toLocaleString('en-US',{minimumIntegerDigits: 2})}</div>
  <div class="Cover">
    <img src="${Cover}" alt="${Title}"/> 
  </div>
  <div class="Info">
    <a class="Title" href="/posts/${Title.replaceAll(' ', '_')}" data-link>
      ${Title}: ${Count}
    </a>
    <p>Type: <span>${Type}</span></p>
    <p>State: <span>${State}</span></p>
  </div>
</article>
  `;
}

const recentItem = ({ ID, Title, Cover, Number, Type, CreatedAt }) => {
  return `
<article>
  <div class="ID">${ID.toLocaleString('en-US',{minimumIntegerDigits: 3})}</div>
  <div class="Cover">
    <img src="${Cover}" alt="${Title}"/> 
  </div>
  <div class="Info">
    <p class="Title">${Title}: ${Number}</p>
    <p>Type: <span>${Type}</span></p>
    <p>Created At: <span>${CreatedAt}</span></p>
  </div>
</article>
  `;
}

getJSON(url, async (error, fileContent) => {
  if(error) {
    console.log(error);
    return
  }
  
  const listSnapshot = await Object.values(fileContent['List']);
  const recentSnapshot = await Object.values(fileContent['Manga4Up']);
  
  mangaList = listSnapshot;
  recentManga = recentSnapshot;
})

class AbstractView {
  constructor(params) {
    this.params = params;
  }

  setTitle(title) {
    document.title = title;
  }

  async getHtml() {
    return "";
  }
}

class Home extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Home");
  }

  async getHtml() {
    return `
      <h1>Manga4Up</h1>
      <p>Manga4Up version local data single page application</p>
      <p>
        <a href="/posts" data-link>View Manga List</a> <br />
        <a href="/recent" data-link>View recent add</a>.
      </p>
    `;
  }
}

class Manga extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Manga");
  }
  
  async getHtml() {
    return `
      <h1>Manga</h1>
      <p>You are viewing the posts!</p>
      
      <div class="Container">
        ${mangaList.reverse().map(data => listItem(data)).join('')}
      </div>
    `;
  }
}

class MangaView extends AbstractView {
  constructor(params) {
    super(params);
    this.postId = params.id;
    this.setTitle("Viewing Manga");
  }

  async getHtml() {
    return `
      <h1>Post</h1>
      <p>You are viewing post ${this.postId.replaceAll('_', ' ')}.</p>
      
      ${
      mangaList.map(({Title, Count, State}) => {
        if(this.postId.replaceAll('_', ' ') === Title) {
          return `
        
        ${Title}: ${Count} <br />
        Manga State: ${State}
        
          `;
        }
      }).join('')
      }
    `;
  }
}

class Recent extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle("Recent");
  }

  async getHtml() {
    return `
      <h1>Recent</h1>
      <p>Manage your privacy and configuration.</p>
      
      <div class="Container">
      ${recentManga.reverse().splice(0, 20).map(data => recentItem(data)).join('')}
      </div>
    `;
  }
}

//////////////////////////////////////////////////////

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
  
  return Object.fromEntries(keys.map((key, i) => {
    return [key, values[i]];
  }));
};

const navigateTo = url => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  const routes = [
    { path: "/", view: Home },
    { path: "/posts", view: Manga },
    { path: "/posts/:id", view: MangaView },
    { path: "/recent", view: Recent }
  ];
  
  // Test each route for potential match
  const potentialMatches = routes.map(route => {
    return {
      route: route,
      result: location.pathname.match(pathToRegex(route.path))
    };
  });

  let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

  if (!match) {
    match = {
      route: routes[0],
      result: [location.pathname]
    };
  }

  const view = new match.route.view(getParams(match));

  document.querySelector("#app").innerHTML = await view.getHtml();
}; // router end 

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", e => {
    if (e.target.matches("[data-link]")) {
      e.preventDefault();
      navigateTo(e.target.href);
    }
    
    console.log(window.location.href);
  });

  setTimeout(() => {router()}, 1000);
});
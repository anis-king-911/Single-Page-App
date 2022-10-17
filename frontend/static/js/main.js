let mangaList, recentManga, url = '/static/data/manga4up-vercel-default-rtdb-export.json';

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

const listItem = (props) => {
  const {
    Title, Cover, Count
  } = props;
  
  return `
  <article>
    <div class="Cover">
      <img src="${Cover}" alt="${Title}" />
    </div>
    <div class="Info">
      <a href="/posts/${Title.replaceAll(' ', '_')}" data-link>
        ${Title}: ${Count}
      </a>
    </div>
  </article>
  `;
}
const recentItem = (props) => {
  return `
  <article>
    <div class="Cover">
      <img src="${props['Volume Cover']}" alt="${props['Manga Title']}" />
    </div>
    <div class="Info">
      ${props['Manga Title']}: ${props['Volume Number']}
      <button>Download Links</button>
    </div>
  </article>
  `;
}

getJSON(url, (error, fileContent) => {
  const snapshot = error ? error : fileContent;
  const listLimit = Object.entries(snapshot['List']).reverse();
  const recentLimit = Object.entries(snapshot['Manga4Up']).reverse().splice(0, 20);
  
  recentManga = recentLimit;
  mangaList = listLimit;
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
      <p>Manga4Up Version Single Page Application</p>
      <p>
        <a href="/posts" data-link>View Manga List</a>.
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
        ${mangaList.map(([key, data]) => listItem(data)).join('')}
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
      mangaList.map(([key, data]) => {
        if(this.postId.replaceAll('_', ' ') === data['Title']) {
          return `
        
        ${data['Title']}: ${data['Count']} <br />
        Manga State: ${data['State']}
        
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
      ${recentManga.map(([key, snap]) => {
        const data = snap['Volume Data']
        return recentItem(data);
      }).join('')}
      </div>
    `;
  }
}


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
  });

  setTimeout(() => {router()}, 1000);
});


// let interval = setInterval(() => {
//   if(mangaList !== null) {
//     clearInterval(interval);
//   } else {
//     console.log(null);
//   }
//   mangaList ? clearInterval(interval) : console.log(null);
// }, 100);

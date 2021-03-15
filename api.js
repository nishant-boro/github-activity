const GitHub = require("github-api");
async function getGitHubData(token) {
  let gh = new GitHub({
    token: token,
  });

  let data = {};
  let me = gh.getUser();
  let repos = await me.listRepos();

  console.log(repos.data);
  data.repos = repos.data;
  return data;
}

module.exports = getGitHubData;

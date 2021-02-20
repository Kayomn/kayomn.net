"use strict";

const gitHubApiUrl = "https://api.github.com";
const blogFeed = document.getElementById("blog-feed");

document.instantiateElement = (tagName, properties) => {
	return Object.assign(document.createElement(tagName), properties);
};

document.instantiateTemplate = (tagName, slotElements) => {
	let instanceNode = document.createElement(tagName);

	for (let slotName in slotElements) {
		let slotElement = slotElements[slotName];
		slotElement.slot = slotName;

		instanceNode.appendChild(slotElement);
	}

	return instanceNode;
}

function updateGitHubFeed(username, htmlElement) {
	if (htmlElement) {
		fetch(`${gitHubApiUrl}/users/${username}/repos`).then((response) => {
			if (response.ok) {
				response.json().then((projects) => {
					if (Array.isArray(projects)) {
						let projectCount = projects.length;

						projects.sort((a, b) => (a.stargazers_count < b.stargazers_count));

						for (let i = 0; i < projectCount; i += 1) {
							let project = projects[i];

							if (!project.fork) {
								htmlElement.appendChild(document.instantiateTemplate("git-feed-item", {
									title: document.instantiateElement("a", {
										innerText: project.name,
										className: "text subheading",
										href: project.html_url
									}),

									description: document.instantiateElement("div", {
										innerText: project.description,
										className: "text body"
									})
								}));
							}
						}
					}
				});
			} else {
				console.warn("Github feed: ", response.status);
			}
		});
	}
}

function updateBlogFeed(offset, limit) {
	if (blogFeed) {
		let responsePromise =
				fetch(`backend/ch/stream.php?name=blog&offset=${offset}&limit=${limit}`);

		blogFeed.innerHTML = "";

		responsePromise.then((response) => {
			if (response.ok) response.json().then((posts) => {
				if (Array.isArray(posts)) {
					let postCount = Math.min(posts.length, limit);

					for (let i = 0; i < postCount; i += 1) {
						let post = posts[i];
						let postLink = `#blog-${post.name}`;

						blogFeed.appendChild(document.instantiateTemplate("blog-feed-item", {
							title: document.instantiateElement("a", {
								innerText: post.title,
								className: "text subheading",
								href: postLink
							}),

							brief: document.instantiateElement("div", {
								innerText: post.brief,
								className: "text body"
							}),

							link: document.instantiateElement("a", {
								innerText: "[ Read More ]",
								className: "text",
								href: postLink
							})
						}));
					}
				}
			});
		});
	}
}

function isNumeric(str) {
	if (typeof str != "string") {
		return false;
	}

	return ((!isNaN(str)) && (!isNaN(parseFloat(str))));
  }

function checkHash(hash) {
	let componentSplitIndex = hash.indexOf("-");
	let hashComponent = "";

	if (componentSplitIndex != -1) {
		hashComponent = hash.substr(componentSplitIndex + 1)
		hash = hash.substr(0, componentSplitIndex)
	}

	switch (hash) {
		case "": {
			// Homepage.
			updateBlogFeed(0, 5);

			return;
		}

		case "blog": {
			// Load blog page.
			let itemsPerPage = 5;

			if (hashComponent) {
				if (isNumeric(hashComponent)) {
					console.log(hashComponent);
					let page = Number(hashComponent);
					let pageStep = (itemsPerPage * page);

					updateBlogFeed(pageStep, (pageStep + 5));
				} else {
					let responsePromise =
							fetch(`backend/ch/content.php?stream=blog&name=${hashComponent}`);

					blogFeed.innerHTML = "";

					responsePromise.then((response) => {
						if (response.ok) response.json().then((post) => {
							blogFeed.appendChild(document.instantiateTemplate("blog-feed-item", {
								title: document.instantiateElement("span", {
									innerText: post.title,
									className: "text subheading"
								}),

								brief: document.instantiateElement("div", {
									innerHTML: marked(post.body),
									className: "text body"
								}),
							}));
						});
					});
				}
			} else {
				updateBlogFeed(0, itemsPerPage);
			}

			return;
		}

		default: break;
	}

	updateBlogFeed(0, 5, blogFeed);
}

window.onload = () => {
	let templateElements = document.getElementsByTagName("template");

	for (let i = 0; i < templateElements.length; i++) {
		let templateElement = templateElements[i];
		let templateElementId = templateElement.id;

		if (templateElementId) {
			customElements.define(templateElementId, class extends HTMLElement {
				connectedCallback() {
					this.attachShadow({mode: "open"})
							.appendChild(templateElement.content.cloneNode(true));
				}
			});
		}
	}

	let logo = document.getElementById("github-feed");

	if (logo) {
		logo.onclick = () => updateBlogFeed(0, 5);
	}

	checkHash(window.location.hash.substr(1));

	window.addEventListener("hashchange", (event) => {
		let newUrl = event.newURL;
		let newHashIndex = newUrl.indexOf("#");

		checkHash((newHashIndex == -1) ? "" : newUrl.substr(newHashIndex + 1));
	});
}


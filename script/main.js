"use strict";

const gitHubApiUrl = "https://api.github.com";

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
			}
		});
	}
}

function openBlogItem(name, htmlElement) {
	if (htmlElement) {
		let responsePromise = fetch(`backend/ch/content.php?stream=blog&name=${name}`);
		htmlElement.innerHTML = "";

		responsePromise.then((response) => {
			if (response.ok) {
				response.json().then((post) => {
					htmlElement.appendChild(document.instantiateTemplate("blog-feed-item", {
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
			}
		});
	}
}

function updateBlogFeed(offset, limit, htmlElement) {
	if (htmlElement) {
		let responsePromise =
				fetch(`backend/ch/stream.php?name=blog&offset=${offset}&limit=${limit}`);

		htmlElement.innerHTML = "";

		responsePromise.then((response) => {
			if (response.ok) {
				response.json().then((posts) => {
					if (Array.isArray(posts)) {
						let postCount = Math.min(posts.length, limit);

						for (let i = 0; i < postCount; i += 1) {
							let post = posts[i];
							let openPost = () => openBlogItem(post.name, htmlElement);

							let titleElement = document.instantiateElement("a", {
								innerText: post.title,
								className: "text subheading",
								href: "#post"
							});

							titleElement.onclick = openPost;

							let textElement = document.instantiateElement("a", {
								innerText: "[ Read More ]",
								className: "text",
								href: "#post"
							});

							textElement.onclick = openPost;

							htmlElement.appendChild(document.instantiateTemplate("blog-feed-item", {
								title: titleElement,

								brief: document.instantiateElement("div", {
									innerText: post.brief,
									className: "text body"
								}),

								link: textElement
							}));
						}
					}
				});
			}
		});
	}
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
	let blogFeed = document.getElementById("blog-feed");

	if (logo) {
		logo.onclick = () => updateBlogFeed(0, 5, blogFeed);
	}

	updateGitHubFeed("Kayomn", document.getElementById("github-feed"));
	updateBlogFeed(0, 5, blogFeed);

	window.addEventListener("hashchange", (event) => {
		let postHash = "#post";

		if (event.oldURL.endsWith(postHash) && (!event.newURL.endsWith(postHash))) {
			updateBlogFeed(0, 5, blogFeed);
		}
	});
}


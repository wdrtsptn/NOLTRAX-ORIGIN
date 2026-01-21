let events = [];

function loadVideo() {
  const url = document.getElementById("videoUrl").value;
  const id = url.split("v=")[1] || url.split("/").pop();
  document.getElementById("player").src =
    `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1`;
}

function tagEvent(tag) {
  const time = new Date().toLocaleTimeString();

  const event = {
    tag,
    time,
    note: ""
  };

  events.push(event);

  const li = document.createElement("li");
  li.textContent = `${time} - ${tag}`;
  document.getElementById("log").appendChild(li);

  console.log(events);
}

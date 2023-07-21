const imageItems = [
	{
	  filename: "iad.gif",
	  link: "/i"
	},
	{
	  filename: "nad.gif",
	  link: "/n"
	},
	{
	  filename: "vad.gif",
	  link: "/v"
	},
  {
    filename: "intad.gif",
    link: "/int"
  },
  {
    filename: "pnad.gif",
    link: "/pn"
  },
  {
    filename: "desad.gif",
    link: "/des"
  },
  {
    filename: "cybad.gif",
    link: "/cyb"
  },
  {
    filename: "aad.gif",
    link: "/a"
  },
  {
    filename: "metad.gif",
    link: "/meta"
  },
  {
    filename: "nbrad.gif",
    link: "/nbr"
  },
  ];
  
  function getRandomIndex(max) {
	return Math.floor(Math.random() * max);
  }
  
  function updateImageAndLink() {
	const randomIndex = getRandomIndex(imageItems.length);
	const randomImageItem = imageItems[randomIndex];
	const imageElement = document.getElementById("rotating-image");
	const linkElement = document.getElementById("image-link");
	const folderPath = "/boardads/";
	const imagePath = folderPath + randomImageItem.filename;
  
	imageElement.src = imagePath;
	linkElement.href = randomImageItem.link;
  }
  
  window.onload = updateImageAndLink;
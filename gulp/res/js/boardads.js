const imageItems = [
	{
	  filename: "iad.png",
	  link: "/i"
	},
	{
	  filename: "nad.png",
	  link: "/n"
	},
	{
	  filename: "vad.png",
	  link: "/v"
	},
	{
        filename: "nbrad.png",
        link: "/nbr"
      },
      {
        filename: "intad.png",
        link: "/int"
      },
      {
        filename: "pnad.gif",
        link: "/pn"
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
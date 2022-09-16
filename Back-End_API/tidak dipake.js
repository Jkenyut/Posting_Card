posts.map((p) => {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      if (directory + "/" + file.replace("\\", "/") !== p.imageUrl) {
        clearImageUrl(directory + "/" + file.replace("\\", "/"));
      }
    }
  });
});

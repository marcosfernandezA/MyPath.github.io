function showSection(id) {
    document.querySelectorAll('.content > div').forEach(div => {
      div.style.display = 'none';
    });
    document.getElementById(id).style.display = 'block';
  }
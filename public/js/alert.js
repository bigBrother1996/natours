export const showAlert = (type, msg) => {
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(() => {
    var node = document.getElementsByClassName('alert');
    if (node[0]) node[0].parentNode.removeChild(node[0]);
  }, 1000);
};


window.onload = () => {
  'use strict';
  let btn =  document.querySelector('#btn_create');

  btn.addEventListener("click", function () 
  { 
    let query = document.getElementById("query").value;
    let columns = get_columns();
    if(columns.length > 0)
    {
      columns = escape_values(columns);
      let column = unite_columns(columns);
      let queries = make_queries(query,column);
      document.getElementById('result').value = queries.join('\n');
    }  

  });
};

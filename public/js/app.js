
function escape_values(columns)
{
  for (let i=0; i< columns.length; i++)   
  {
    for (let ii=0; ii< columns[i].length; ii++)    
    {
      let s = columns[i][ii];
      if(s.indexOf("'") > -1)
      {
        s = s.replace(/'/g, "''");
        columns[i][ii] = s;
      }
    }
  }  
  return columns;
}

function make_queries(query,column) //templating the columns into the placeholder
{
  let n = (query.split("{}").length - 1) ;
  let queries = [];
  for (let i=0; i< column.length; i++)   
  {
     queries[i] = query;
  }

  for (let i=0; i<n; i++)
  {
    for (let ii=0; ii< column.length; ii++)   
    {
       queries[ii] = queries[ii].replace("{}",column[ii][i]);
    }
  }
  return queries;
}


function get_columns() //getting the filled columes and send them back as array
{
  let c = [];
  let columns = document.getElementById('columns');
  let e = columns.getElementsByTagName('textarea');
  for (let i=0; i<e.length; i++) 
  {
    let arr = e[i].value.split('\n');
    // let arr = e[i].value.match(/[^\r\n]+/g);
    if(arr.length > 1)
    {
      c[i] = arr;
    }
  }
  return c;
}


function unite_columns(c) //take the smallest column and create one master column with other columns as nested array 
{
  if(c.length == 0) return;
    
  let rows = c[0].length;
  for(var i=0; i<c.length; i++) 
  {
    if(c[i].length < rows) //get colum with the least rows
    {
      rows = c[i].length;
    }
  }

  let columns = [];
  for(let i=0; i < rows; i++) 
  {
    columns[i] = [];
  }

  for(let i=0; i<c.length; i++) 
  {
    for(let ii=0; ii < c[i].length; ii++) 
    {
      if(ii < rows)
      {
        columns[ii].push(c[i][ii]);
      }
    }     
  }
  return columns;
}

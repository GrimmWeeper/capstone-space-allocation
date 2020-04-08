const getTableData = (req, res, db) => {
  db.select('*').from('escdummy')
  .then(items => {
    if(items.length){
      res.json(items)
    } else {
      res.json({dataExists: 'false'})
    }
  })
  .catch(err => res.status(400).json({dbError: 'db error'}))
}
  
const postTableData = async (req, res, db) => {

  // Create table if it doesn't exist
  await db.schema.hasTable('escdummy').then(function(exists) {
    if (!exists) {
      return db.schema.createTable('escdummy', function(t) {
        t.string('id').primary();
        t.string('company');
        t.string('project_name');
        t.string('type_of_prototype');
        t.float('length');
        t.float('width');
        t.float('height');
        t.integer('number_of_power_points_needed');
        t.date('date_added');
      })
    }
  })

  // Delete previous values (if any)
  db('escdummy').del()
  .catch(err => res.status(400).json({dbError: 'db error'}))

  // Insert values from CSV
  for (let i = 0; i < req.body.length; i++) {
    const { id, company, project_name, type_of_prototype, length, width, height, number_of_power_points_needed } = req.body[i]
    const date_added = new Date()
    db('escdummy').insert({id, company, project_name, type_of_prototype, length, width, height, number_of_power_points_needed, date_added})
    .returning('*')
    .then(item => {
      res.json(item)
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
  }
}
  
const putTableData = (req, res, db) => {
  for (let i = 0; i < req.body.length; i++) {
    const { id, company, project_name, type_of_prototype, length, width, height, number_of_power_points_needed } = req.body[i]
    const date_added = new Date()
    db('escdummy').where({
      id: id
    })
    .update({id, company, project_name, type_of_prototype, length, width, height, number_of_power_points_needed, date_added})
    .returning('*')
    .then(item => {
      res.json(item)
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
  }
  
  // const { id, first, last, email, phone, location, hobby } = req.body
  // db('escdummy').where({id}).update({first, last, email, phone, location, hobby})
  //   .returning('*')
  //   .then(item => {
  //     res.json(item)
  //   })
  //   .catch(err => res.status(400).json({dbError: 'db error'}))
}
  
const deleteTableData = (req, res, db) => {
  const { id } = req.body
  db('escdummy').where({id}).del()
    .then(() => {
      res.json({delete: 'true'})
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getSquares = (req, res, db, st) => {
  db.postgisDefineExtras((knex, formatter) => ({  
    asGeoJSON2(col) { // Not exactly sure why st.asGeoJSON won't build the query right
      return knex.raw('ST_asGeoJSON(?)', [formatter.wrapWKT(col)]);
    }
  }));
  
  db.withSchema('gis').select('squares_l1_05m.project_no',st.asGeoJSON2('squares_l1_05m.geom'))
  .from('ccl1').rightJoin('squares_l1_05m', st.dwithin('ccl1.geom', 'squares_l1_05m.geom', 0))
  .leftJoin('ccl1_pits', st.intersects('ccl1_pits.geom', 'squares_l1_05m.geom'))
  .whereNull('ccl1_pits.gid')
  .where('project_no', -1)  
  .then(items => {
    if(items.length){
      res.json(items)
    } else {
      res.json({dataExists: 'false'})
    }
  })
  .catch(err => res.status(400).json({dbError: 'db error'}))
}

const clearSquares = (req, res, db) => {
  db('squares_l1_05m').withSchema('gis')
  .update({
    project_no : '-1',
  })
  .then(items => {
      res.json({Update: 'true'})
  })
  .catch(err => res.status(400).json({dbError: 'db error'}))
}


function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

const allocateSquares = async(req, res, db, st) => {
  
  let data = await db.select('*').from('escdummy')
  .where('height', '<', 50)
  .orderByRaw('length+width DESC')
  .limit(20)
  .catch(err => res.status(400).json({dbError: 'db error'}))  

  // 1. randomly select a row
  // 2. check if has all we need
  // 3. update
  for (let p = 0; p < data.length; p++){
    let success = false;
    while (!success){

      let i = parseInt(data[p].length/0.5)
      let j = parseInt(data[p].width/0.5)

      let random = await db.withSchema('gis').select('squares_l1_05m.*')
      .from('ccl1').leftJoin('squares_l1_05m', st.dwithin('ccl1.geom', 'squares_l1_05m.geom', 0))
      .leftJoin('ccl1_pits', st.intersects('ccl1_pits.geom', 'squares_l1_05m.geom'))
      .whereNull('ccl1_pits.gid')
      .where('project_no', -1)
      .orderByRaw('random()')
      .limit(1)
      .catch(err => res.status(400).json({dbError: 'db error'}))

      let random_a = parseInt(random[0].a)
      let random_b = parseInt(random[0].b)

      let count = await db.withSchema('gis').count('squares_l1_05m.a','squares_l1_05m.b')
      .from('ccl1').leftJoin('squares_l1_05m', st.dwithin('ccl1.geom', 'squares_l1_05m.geom', 0))
      .leftJoin('ccl1_pits', st.intersects('ccl1_pits.geom', 'squares_l1_05m.geom'))
      .whereNull('ccl1_pits.gid')
      .where('project_no', -1)
      .whereBetween('a', [random_a, random_a + i -1])
      .whereBetween('b', [random_b, random_b + j -1])
      .catch(err => res.status(400).json({dbError: 'db error'}))

      if (parseInt(count[0].count) == i*j){ //update if all values are available
        
        await db('squares_l1_05m').withSchema('gis').update({
          project_no : isInt(data[p].id)? data[p].id : 1
        })
        .whereBetween('a', [random_a, random_a + i -1])
        .whereBetween('b', [random_b, random_b + j -1])
        .catch(err => res.status(400).json({dbError: 'db error'}))
        success = true
      } 
      else {
        // res.json({test: 'failure'})
        success = false 
      }
    }
  }
  res.json({test: 'success'})
}



module.exports = {
  getTableData,
  postTableData,
  putTableData,
  deleteTableData,
  getSquares,
  clearSquares,
  allocateSquares,
}
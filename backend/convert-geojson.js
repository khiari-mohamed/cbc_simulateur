const fs = require('fs');
const path = require('path');

// Read the GeoJSON file
const geojsonPath = path.join(__dirname, '../frontend/public/tun3.geojson');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Extract unique localities from ADM3 features
const localities = geojson.features
  .filter(f => f.properties.shapeType === 'ADM3')
  .map(f => f.properties.shapeName);

// Group localities by common patterns (simplified approach)
// Since the data doesn't have proper hierarchy, we'll create a basic structure
const governoratesMap = {};

localities.forEach(locality => {
  // Try to extract governorate from locality name (basic heuristic)
  // For Tunisia, we'll use the first word as governorate approximation
  const parts = locality.split(' ');
  const gov = parts[0] || locality;
  
  if (!governoratesMap[gov]) {
    governoratesMap[gov] = new Set();
  }
  governoratesMap[gov].add(locality);
});

// Build hierarchical structure
const result = {
  governorates: Object.keys(governoratesMap).sort().map(govName => ({
    name: govName,
    delegations: [{
      name: govName,
      localities: Array.from(governoratesMap[govName]).sort()
    }]
  }))
};

// Write to output file
const outputPath = path.join(__dirname, '../frontend/public/tunisia-locations.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

console.log(`✅ Converted ${localities.length} localities`);
console.log(`✅ Created ${result.governorates.length} governorate groups`);
console.log(`✅ Output saved to: ${outputPath}`);

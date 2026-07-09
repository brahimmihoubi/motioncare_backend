const seedExercises = async (run, get) => {
  const defaultExercises = [
    { name: 'Lying Leg Raises', description: 'Strengthens lower abdominal muscles and hip flexors.', image_url: '' },
    { name: 'Heel Slide', description: 'Improves range of motion in the knee and hip.', image_url: '' },
    { name: 'Leg Curl', description: 'Strengthens the hamstrings.', image_url: '' },
    { name: 'Seated Knee Flexion-Extension', description: 'Improves knee mobility and strengthens quadriceps.', image_url: '' }
  ];

  for (const ex of defaultExercises) {
    const existing = await get('SELECT id FROM exercises WHERE name = ?', [ex.name]);
    if (!existing) {
      await run('INSERT INTO exercises (name, description, image_url) VALUES (?, ?, ?)', [ex.name, ex.description, ex.image_url]);
    }
  }
  console.log('Seeded default exercises successfully.');
};

module.exports = { seedExercises };

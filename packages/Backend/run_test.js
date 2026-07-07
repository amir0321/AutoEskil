import { setupDB } from "./db.js";
import { addCar } from "./src/controllers/carsController.js";

async function test() {
  const db = await setupDB();

  // Add a car with multiple images
  const carData = {
    dealer_id: "test_dealer",
    brand: "TestBrand",
    model: "TestModel",
    year: "2023",
    price: 100000,
    mileage: 1000,
    fuel_type: "Bensin",
    description: "Test car",
    images: ["img1.jpg", "img2.jpg", "img3.jpg"],
  };

  // Make sure a dealer exists first to satisfy FK
  await db.run(
    "INSERT OR IGNORE INTO dealers (id, name, contact_person, email, phone) VALUES ('test_dealer', 'Test', 'Test', 'test@test.com', '123')",
  );

  const result = await addCar(db, carData);
  console.log("Added car result:", result);

  if (result.success) {
    // Test GET query
    const cars = await db.all(
      `
            SELECT c.id, 
                   json_agg(ci.image_url) as car_images_list
            FROM cars c
            LEFT JOIN car_images ci ON c.id = ci.car_id
            WHERE c.id = ?
            GROUP BY c.id
        `,
      [result.carId],
    );

    console.log("Fetched car:", cars);

    if (cars[0] && cars[0].car_images_list) {
      console.log(
        "Parsed images:",
        JSON.parse(cars[0].car_images_list).filter((url) => url !== null),
      );
    }

    // Clean up
    await db.run("DELETE FROM cars WHERE id = ?", [result.carId]);
  }
}
test();

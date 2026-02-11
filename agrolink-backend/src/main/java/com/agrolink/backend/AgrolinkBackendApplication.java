package com.agrolink.backend;

import com.agrolink.backend.model.Category;
import com.agrolink.backend.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class AgrolinkBackendApplication {

	@Bean
	public CommandLineRunner run(CategoryRepository categoryRepository) {
		return args -> {
			System.out.println("Checking for legacy categories...");
			List<Category> categories = categoryRepository.findAll();
			for (Category category : categories) {
				System.out.println("Category: " + category.getName() + ", Type: '" + category.getType() + "'");

				// Produce categories -> MARKETPLACE
				if (List.of("Vegetables", "Fruits", "Spices", "Grains").contains(category.getName())) {
					if (!"MARKETPLACE".equals(category.getType())) {
						category.setType("MARKETPLACE");
						categoryRepository.save(category);
						System.out.println("Correction: Moved " + category.getName() + " to MARKETPLACE");
					}
				}
				// Inputs/Other -> FARMERS_SHOP (Default for legacy if not produce)
				else if (category.getType() == null || category.getType().isEmpty()
						|| (!"MARKETPLACE".equals(category.getType()) && !"FARMERS_SHOP".equals(category.getType()))) {
					category.setType("FARMERS_SHOP");
					categoryRepository.save(category);
					System.out.println("Updated legacy category: " + category.getName() + " to FARMERS_SHOP");
				}
			}
		};
	}

	public static void main(String[] args) {
		SpringApplication.run(AgrolinkBackendApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner databaseFix(javax.sql.DataSource dataSource) {
		return args -> {
			try (java.sql.Connection conn = dataSource.getConnection();
					java.sql.Statement stmt = conn.createStatement()) {
				System.out.println("Applying database fix: Altering order_items to allow null product_id");
				stmt.execute("ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL");
				System.out.println("Database fix applied successfully!");
			} catch (Exception e) {
				System.out
						.println("Database fix failed (might already be nullable or table missing): " + e.getMessage());
			}
		};
	}

}

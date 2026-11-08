package pve_bms_backend.category.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pve_bms_backend.category.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCase(String name);

}
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.UUID;

public class TestSaveProduct {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try (Connection con = DriverManager.getConnection(url, user, password)) {
            
            // Generate UUID
            UUID id = UUID.randomUUID();
            UUID adminId = UUID.fromString("00000000-0000-0000-0000-000000000000");
            
            String insert = "INSERT INTO public.farmer_shop_products (id, admin_id, name, category, price, stock_quantity, status) VALUES (?, ?, 'Test', 'Seeds', 100, 10, 'available')";
            try (PreparedStatement pstmt = con.prepareStatement(insert)) {
                pstmt.setObject(1, id);
                pstmt.setObject(2, adminId);
                pstmt.executeUpdate();
                System.out.println("Inserted successfully!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

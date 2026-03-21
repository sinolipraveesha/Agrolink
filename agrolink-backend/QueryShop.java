import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class QueryShop {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement()) {
            
            System.out.println("--- Dumping public.farmer_shop_products ---");
            ResultSet rs = stmt.executeQuery("SELECT * FROM public.farmer_shop_products;");
            while(rs.next()) {
                System.out.println("ID: " + rs.getString("id") + " | Name: " + rs.getString("name") + " | Price: " + rs.getString("price"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

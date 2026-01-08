import { User } from "../../../src/models/user";

describe('User class', () => {
  it('should create a user instance', () => {
    const user = new User();
    expect(user).toBeInstanceOf(User);
  });

  it('should set and get user properties', () => {
    const user = new User();
    user.id = 1;
    user.email = 'test@example.com';
    user.name = 'Test User';
    
    expect(user.id).toBe(1);
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should return creation date local as local format', () => {
    const date = new Date();   
    const user = new User()
    user.createdAt = date;
    
    expect(user.createdAtLocal).toBe(date.toLocaleString("fr-FR"))
  })
})


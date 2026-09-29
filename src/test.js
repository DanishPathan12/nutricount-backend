var arr = [1, 2, 3, 4, 5];
arr.push(6);
console.log(arr); // Output: [1, 2, 3, 4, 5, 6]
var printType = function (arg) {
    // console.log(typeof arg);
    return arg;
};
//creting a fucntion to log it take fucntion as a parameter and return  console log of fucntion 
var logFunction = function (func, arg) {
    console.log(func(arg));
};
logFunction(printType, 123); // Output: 123
logFunction(printType, "Hello"); // Output: Hello   
logFunction(printType, true); // Output: true
console.log(printType(123)); // Output: number
console.log(printType("Hello")); // Output: string
console.log(printType(true)); // Output: boolean
var user1 = {
    name: "John",
    age: 30,
    email: "john@example.com"
};
var UserRole;
(function (UserRole) {
    UserRole["Admin"] = "Admin";
    UserRole["User"] = "User";
    UserRole["Guest"] = "Guest";
})(UserRole || (UserRole = {}));
var user2 = {
    name: "Jane",
    age: 25,
    email: "danish@gmail.com",
    role: UserRole.Admin,
    country: "UK"
};
user1.name = "Danish";
console.log(user1);
console.log(user2);
var user3 = {
    name: "Ali",
    age: 28,
    email: "Ali@gmail.com",
    role: UserRole.User,
};
console.log(user3);
var test = user3.role === UserRole.Admin ? "Admin" : "Not Admin";
console.log(test); // Output: Not Admin

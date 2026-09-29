
const arr: number[] = [1, 2, 3, 4, 5];
arr.push(6);
console.log(arr); // Output: [1, 2, 3, 4, 5, 6]

const printType= <T>(arg:T):T=>{
    // console.log(typeof arg);
    return arg;
}
//creting a fucntion to log it take fucntion as a parameter and return  console log of fucntion 
const logFunction = <T>(func: (arg: T) => T, arg: T): void => {
    console.log(func(arg));
}

logFunction(printType, 123); // Output: 123
logFunction(printType, "Hello"); // Output: Hello   
logFunction(printType, true); // Output: true

console.log(printType(123)); // Output: number
console.log(printType("Hello")); // Output: string
console.log(printType(true)); // Output: boolean



type User={
    name:string;
    age:number;
    email:string;
}

const user1:User={
    name:"John",
    age:30,
    email:"john@example.com"
}

interface UserInterface{
    name:string;
    age:number;
    email:string;
}

interface AdminInterface extends UserInterface{
    role:UserRole;
    country?:country;
}

enum UserRole{
    Admin="Admin",
    User="User",
    Guest="Guest"
}


type country = "USA" | "Canada" | "UK" | "Australia";


const user2:AdminInterface={
    name:"Jane",
    age:25,
    email:"danish@gmail.com",
    role:UserRole.Admin,
    country:"UK"
}

user1.name="Danish";
console.log(user1); 
console.log(user2);

const user3:AdminInterface={
    name:"Ali",
    age:28,
    email:"Ali@gmail.com",
    role:UserRole.User,
}


console.log(user3)

const test=user3.role===UserRole.Admin? "Admin":"Not Admin";

console.log(test); // Output: Not Admin
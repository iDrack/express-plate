export enum Role {
    ADMIN = "ADMIN",
    USER = "USER",
}

export const isRole = (value: string): value is Role => {
    return Object.values(Role).includes(value as Role);
};

export const toRole = (value: string) => {
    if (isRole(value)) {
        switch (value) {
            case Role.ADMIN:
                return Role.ADMIN;
                break;
            case Role.USER:
                return Role.USER;
                break;
            default:
                throw new Error(`Unknown role : ${value}`);
                break;
        }
    } else {
        throw new Error(`Unknown role : ${value}`);
    }
};

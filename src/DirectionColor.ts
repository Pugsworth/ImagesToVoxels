import { vec3, Vec3, PackedColor, getMaterialForSide, Side } from "./util.ts";


export class DirectionColor
{
    static NORTH = new DirectionColor(Side.TOP, vec3(1, 0, 0), 0xFF0000);
    static SOUTH = new DirectionColor(Side.BOTTOM, vec3(-1, 0, 0), 0xFF2222);

    static EAST = new DirectionColor(Side.EAST, vec3(0, 0, 1), 0x00FF00);
    static WEST = new DirectionColor(Side.WEST, vec3(0, 0, -1), 0x22FF22);

    static UP   = new DirectionColor(Side.TOP, vec3(0, 1, 0), 0x0000FF);
    static DOWN = new DirectionColor(Side.BOTTOM, vec3(0, -1, 0), 0x2222FF);

    _name: string;
    _vector: Vec3;
    _color: PackedColor;
    _side: Side;

    constructor(side: Side=Side.NONE, vec: Vec3=vec3(0), color: PackedColor=0)
    {
        this._name = Side[side];
        this._side = side;
        this._color = color;
        this._vector = vec;
    }

    static of(side: Side): DirectionColor
    {
        switch (side) {
            case Side.TOP:
                return DirectionColor.UP;
            case Side.BOTTOM:
                return DirectionColor.DOWN;
            case Side.NORTH:
                return DirectionColor.NORTH;
            case Side.SOUTH:
                return DirectionColor.SOUTH;
            case Side.EAST:
                return DirectionColor.EAST;
            case Side.WEST:
                return DirectionColor.WEST;

            default:
                throw new Error("Invalid side: " + side);
        }
    }

    public get material()
    {
        return getMaterialForSide(this._side);
    }

    public get vector(): Vec3
    {
        return this._vector;
    }

    public color(): PackedColor
    {
        return this._color;
    }

    public get name(): string
    {
        return this._name || "";
    }
}
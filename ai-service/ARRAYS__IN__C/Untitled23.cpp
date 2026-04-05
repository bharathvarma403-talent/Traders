// passing array call by value method
#include<stdio.h>
void fun1(int *p)
{
	int i;
	for(i=0;i<4;i++)
	{
		*(p+i) = *(p+i)%2;
	}
	printf("Values after update inside fun\n");
	for(i=0;)
	
}
int main()
{
	int n[4] = {11,22,33,44};
	fun1(n); // call by address or pointer or refernce
}
